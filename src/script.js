$(function() {

    var download = $('.js-download');
    var width = $('.js-width');
    var archiveName = Date.now();

    width.on('change', function() {
        uppy.setMeta({
            size: parseInt($(this).val()),
            archiveName: archiveName
        });
    })

    var _URL = window.URL || window.webkitURL;
    var img = new Image();

    var uppy = Uppy.Core({ 
        autoProceed: false,
        restrictions: {
            allowedFileTypes: ['image/*']
        },
        onBeforeFileAdded: async function (currentFile)  {
            if(await getImageWidth(_URL.createObjectURL(currentFile.data)) < parseInt(width.val())) {
                return Promise.reject(`${currentFile.name} is too small`);
            }else {
                return Promise.resolve();
            }
        }
    });

    
    uppy.setMeta({
        size: parseInt(width.val()),
        archiveName: archiveName
    });

    uppy.use(Uppy.Dashboard, {
        inline: true,
        target: '.DashboardContainer',
        note: '',
        metaFields: [
            {
                id: 'size',
                name: 'Size',
                placeholder: 'Enter width of this image'
            }
        ]
    });

    uppy.use(Uppy.XHRUpload, {
        endpoint: '/upload',
        formData: true,
        fieldName: 'image',
        timeout: 300 * 1000 // 300 seconds
    });

    uppy.on('complete', function(result) {
        download.attr('href', '/download/'+archiveName);
        download.addClass('is-active');
    });

    uppy.run();
});

function getImageWidth(src) {
    return new Promise((resolve, reject) => {
        let img = new Image()
        img.src = src
        img.onload = () => resolve(img.width)
        img.onerror = reject
    })
}